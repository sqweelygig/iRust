import * as Crypto from "crypto";
import { promises as FS } from "fs";
import * as YML from "js-yaml";
import * as Path from "path";
import * as Git from "simple-git/promise";
// TODO [REFACTOR] All these data-repository items should be identical, so should be the same file
// TODO [IMPROVEMENT] The update callback should be an array

declare interface Config {
	mixpanelToken: string;
	title: string;
	theme: string;
	wotdHash: string;
}

export class DataRepository {
	public static async build(
		remote: string,
		onUpdate: (pullResult: Git.PullResult) => void,
	): Promise<DataRepository> {
		const repo = new DataRepository(remote, onUpdate);
		await repo.clone();
		return repo;
	}

	private readonly remote: string;
	private readonly dataFolder: string;
	private readonly onUpdate: Array<(pullResult: Git.PullResult) => void>;

	private constructor(
		remote: string,
		onUpdate: (pullResult: Git.PullResult) => void,
	) {
		this.remote = remote;
		const hash = Crypto.createHash("sha256");
		hash.update(remote);
		const folder = hash.digest("base64");
		// This mapping of folders keeps the full history of every repo
		// TODO Prune data repository back log...
		// Probably by checking Git remotes
		this.dataFolder = Path.join("/", "data", folder);
		this.onUpdate = [onUpdate];
	}

	public async get(path: string): Promise<string> {
		return FS.readFile(this.getDataPath(path), "utf8");
	}

	public async getConfig(): Promise<Config> {
		const configString = await this.get(Path.join("config", "config.yml"));
		return YML.safeLoad(configString);
	}

	public async getContent(page: string): Promise<string> {
		return this.get(Path.join("content", `${page}.md`));
	}

	public getDataPath(path: string): string {
		return Path.join(this.dataFolder, path);
	}

	public async clone(): Promise<void> {
		const keyFile = Path.join("/", "usr", "src", "imuse", ".ssh", "github");
		await FS.writeFile(
			keyFile,
			[
				"-----BEGIN RSA PRIVATE KEY-----",
				process.env.TOKEN,
				"-----END RSA PRIVATE KEY-----",
			].join("\r\n"),
			{
				encoding: "utf8",
				flag: "w",
				mode: "700",
			},
		);
		await FS.chmod(keyFile, "700");

		try {
			await FS.stat(this.dataFolder);
			await Git(this.dataFolder).pull();
		} catch (error) {
			await FS.mkdir(this.dataFolder);
			// TODO store github's known_hosts fingerprint in ssh_config
			// TODO shallow clone
			await Git(Path.join("/", "data")).clone(this.remote, this.dataFolder);
		}

		setInterval(async () => {
			const pullResult = await Git(this.dataFolder).pull();
			this.onUpdate.forEach((onUpdate) => {
				onUpdate(pullResult);
			});
		}, 5 * 60 * 1000);
	}
}
