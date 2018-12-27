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

	if(IT8951_Init())
	{
		printf("IT8951_Init error \n");
		return 1;
	}

	//IT8951DisplayExample();
	//IT8951DisplayExample2();
	//IT8951DisplayExample3();
	//printf("IT8951_GUI_Example\n");
	IT8951_GUI_Example();

	IT8951_Cancel();

	return 0;
}


