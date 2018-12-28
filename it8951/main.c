#include "IT8951.h"

void awaitHardwareReady()
{
	uint8_t hardwareReady;
	hardwareReady = bcm2835_gpio_lev(HRDY);
	while(hardwareReady == 0)
	{
		hardwareReady = bcm2835_gpio_lev(HRDY);
	}
}

int main (int argc, char *argv[])
{
	uint32_t i;
	uint32_t j;
	IT8951DevInfo deviceInfo;
	uint16_t* deviceInfo_byWord = (uint16_t*)&deviceInfo;
	uint32_t deviceInfo_wordCount = sizeof(IT8951DevInfo)/2;

	/*
	 * Initialise the Broadcom SPI chip
	 */
	bcm2835_init();
	bcm2835_spi_begin();
	bcm2835_spi_setClockDivider(BCM2835_SPI_CLOCK_DIVIDER_32);
	bcm2835_gpio_fsel(CS, BCM2835_GPIO_FSEL_OUTP);
	bcm2835_gpio_fsel(HRDY, BCM2835_GPIO_FSEL_INPT);
	bcm2835_gpio_fsel(RESET, BCM2835_GPIO_FSEL_OUTP);
	bcm2835_gpio_write(CS, HIGH);

	/*
	 * Initialise the display
	 */
	bcm2835_gpio_write(RESET, LOW);
	bcm2835_delay(100);
	bcm2835_gpio_write(RESET, HIGH);

	/*
	 * Request the display properties
	 */
	awaitHardwareReady();
	bcm2835_gpio_write(CS,LOW);
	bcm2835_spi_transfer(0x60);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x03);
	bcm2835_spi_transfer(0x02);
	bcm2835_gpio_write(CS,HIGH);

	/*
	 * Read the display properties
	 */
	awaitHardwareReady();
	bcm2835_gpio_write(CS,LOW);
	bcm2835_spi_transfer(0x10);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x00);
	for(i=0;i<deviceInfo_wordCount;i++)
	{
		deviceInfo_byWord[i] = bcm2835_spi_transfer(0x00)<<8;
		deviceInfo_byWord[i] |= bcm2835_spi_transfer(0x00);
	}
	bcm2835_gpio_write(CS,HIGH);

	/*
	 * Present the display properties
	 */
	IT8951DevInfo* deviceInfo_asInfo = (IT8951DevInfo*)&deviceInfo;
	printf("****** main ******\n");
	printf(
		"Words in Device Info = %d\r\n",
		deviceInfo_wordCount
	);
	printf(
		"Panel(W,H) = (%d,%d)\r\n",
		deviceInfo_asInfo->usPanelW,
		deviceInfo_asInfo->usPanelH
	);
	printf(
		"Image Buffer Addr = %X\r\n",
		deviceInfo_asInfo->usImgBufAddrL | (deviceInfo_asInfo->usImgBufAddrH << 16)
	);
	printf(
		"FW Version = %s\r\n",
		(uint8_t*)deviceInfo_asInfo->usFWVersion
	);
	printf(
		"LUT Version = %s\r\n",
		(uint8_t*)deviceInfo_asInfo->usLUTVersion
	);

	/*
	 * Start a whole screen update
	 */
	awaitHardwareReady();
	bcm2835_gpio_write(CS,LOW);
	bcm2835_spi_transfer(0x60);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x20);
	bcm2835_gpio_write(CS,HIGH);
	awaitHardwareReady();
	bcm2835_gpio_write(CS,LOW);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x30);
	bcm2835_gpio_write(CS,HIGH);

	/*
	 * Send the payload
	 */
	bcm2835_gpio_write(CS,LOW);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x00);
	for(i=0;i<1200;i++) {
		for(j=0;j<825;j++) {
			bcm2835_spi_transfer(0x00);
			bcm2835_spi_transfer(0x00);
		}
	}
	bcm2835_gpio_write(CS,HIGH);

	/*
	 * End the whole screen update
	 */
	awaitHardwareReady();
	bcm2835_gpio_write(CS,LOW);
	bcm2835_spi_transfer(0x60);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x22);
	bcm2835_gpio_write(CS,HIGH);

	/*
	 * Request that the whole screen updates
	 */
	awaitHardwareReady();
	bcm2835_gpio_write(CS,LOW);
	bcm2835_spi_transfer(0x60);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x34);
	bcm2835_gpio_write(CS,HIGH);
	awaitHardwareReady();
	bcm2835_gpio_write(CS,LOW);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x04);
	bcm2835_spi_transfer(0xb0);
	bcm2835_spi_transfer(0x03);
	bcm2835_spi_transfer(0x39);
	bcm2835_spi_transfer(0x00);
	bcm2835_spi_transfer(0x02);
	bcm2835_gpio_write(CS,HIGH);

	/*
	 * Close the Broadcom connection down
	 */
	bcm2835_spi_end();
	bcm2835_close();

	return 0;
}


