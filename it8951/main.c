#include "IT8951.h"

IT8951DevInfo deviceInfo;

int main (int argc, char *argv[])
{
	bcm2835_init();

	bcm2835_spi_begin();
	bcm2835_spi_setBitOrder(BCM2835_SPI_BIT_ORDER_MSBFIRST);
	bcm2835_spi_setDataMode(BCM2835_SPI_MODE0);
	bcm2835_spi_setClockDivider(BCM2835_SPI_CLOCK_DIVIDER_32);

	bcm2835_gpio_fsel(CS, BCM2835_GPIO_FSEL_OUTP);
	bcm2835_gpio_fsel(HRDY, BCM2835_GPIO_FSEL_INPT);
	bcm2835_gpio_fsel(RESET, BCM2835_GPIO_FSEL_OUTP);

	bcm2835_gpio_write(CS, HIGH);

	printf("****** IT8951(d) ******\n");

	bcm2835_gpio_write(RESET, LOW);
	bcm2835_delay(100);
	bcm2835_gpio_write(RESET, HIGH);

	/*
	 * Request the display properties
	 */
	uint32_t i;
	uint16_t* byWord_deviceInfo = (uint16_t*)&gstI80DevInfo;
	uint32_t wordCount_deviceInfo = sizeof(IT8951DevInfo)/2;
	awaitHardwareReady();
	bcm2835_gpio_write(CS,LOW);
	bcm2835_spi_transfer(0x60);
	bcm2835_spi_transfer(0x00);
	awaitHardwareReady();
	bcm2835_spi_transfer(0x03);
	bcm2835_spi_transfer(0x02);
	bcm2835_gpio_write(CS,HIGH);
	awaitHardwareReady();
	bcm2835_gpio_write(CS,LOW);
	bcm2835_spi_transfer(0x10);
	bcm2835_spi_transfer(0x00);
	awaitHardwareReady();
	bcm2835_spi_transfer(0x00); // The first two bytes are just empty space
	bcm2835_spi_transfer(0x00); // The first two bytes are just empty space
	awaitHardwareReady();
	for(i=0;i<wordCount_deviceInfo;i++)
	{
		byWord_deviceInfo[i] = bcm2835_spi_transfer(0x00)<<8;
		byWord_deviceInfo[i] |= bcm2835_spi_transfer(0x00);
	}
	bcm2835_gpio_write(CS,HIGH);

	/*
	 * Present the display properties
	 */
	IT8951DevInfo* deviceInfo = (IT8951DevInfo*)&gstI80DevInfo;
	printf(
		"Words in Device Info = %d\r\n",
		wordCount_deviceInfo
	);
	printf(
		"Panel(W,H) = (%d,%d)\r\n",
		deviceInfo->usPanelW,
		deviceInfo->usPanelH
	);
	printf(
		"Image Buffer Address = %X\r\n",
		deviceInfo->usImgBufAddrL | (deviceInfo->usImgBufAddrH << 16)
	);
	printf(
		"FW Version = %s\r\n",
		(uint8_t*)deviceInfo->usFWVersion
	);
	printf(
		"LUT Version = %s\r\n",
		(uint8_t*)deviceInfo->usLUTVersion
	);

	if(IT8951_Init())
	{
		printf("IT8951_Init error \n");
		return 1;
	}

	IT8951_GUI_Example();

	IT8951_Cancel();

	return 0;
}


