#include "IT8951.h"

int main (int argc, char *argv[])
{
	/*
	printf("ReadReg = 0x%x\n",IT8951ReadReg(LISAR));
	IT8951WriteReg(LISAR,0x1234);
	printf("ReadReg = 0x%x\n",IT8951ReadReg(LISAR));
	*/

	bcm2835_init();

	bcm2835_spi_begin();
	bcm2835_spi_setBitOrder(BCM2835_SPI_BIT_ORDER_MSBFIRST);   	//default
	bcm2835_spi_setDataMode(BCM2835_SPI_MODE0);               		//default
	bcm2835_spi_setClockDivider(BCM2835_SPI_CLOCK_DIVIDER_32);		//default

	bcm2835_gpio_fsel(CS, BCM2835_GPIO_FSEL_OUTP);
	bcm2835_gpio_fsel(HRDY, BCM2835_GPIO_FSEL_INPT);
	bcm2835_gpio_fsel(RESET, BCM2835_GPIO_FSEL_OUTP);

	bcm2835_gpio_write(CS, HIGH);

	printf("****** IT8951 ******\n");

	bcm2835_gpio_write(RESET, LOW);
	bcm2835_delay(100);
	bcm2835_gpio_write(RESET, HIGH);

	//Get Device Info
	GetIT8951SystemInfo(&gstI80DevInfo);

	gpFrameBuf = malloc(gstI80DevInfo.usPanelW * gstI80DevInfo.usPanelH);

 	gulImgBufAddr = gstI80DevInfo.usImgBufAddrL | (gstI80DevInfo.usImgBufAddrH << 16);

 	//Set to Enable I80 Packed mode
 	IT8951WriteReg(I80CPCR, 0x0001);

	//IT8951DisplayExample();
	//IT8951DisplayExample2();
	//IT8951DisplayExample3();
	//printf("IT8951_GUI_Example\n");
	//IT8951_GUI_Example();

	if (argc != 4)
	{
		printf("Error: argc!=4.\n");
		exit(1);
	}

	uint32_t x,y;
	sscanf(argv[1],"%d",&x);
	sscanf(argv[2],"%d",&y);

	IT8951_BMP_Example(x,y,argv[3]);

	IT8951_Cancel();

	return 0;
}


