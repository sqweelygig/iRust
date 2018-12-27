#include "IT8951.h"

int main (int argc, char *argv[])
{
	bcm2835_init();

	bcm2835_spi_begin();
	bcm2835_spi_setBitOrder(BCM2835_SPI_BIT_ORDER_MSBFIRST);   	//default
	bcm2835_spi_setDataMode(BCM2835_SPI_MODE0);               		//default
	bcm2835_spi_setClockDivider(BCM2835_SPI_CLOCK_DIVIDER_32);		//default

	bcm2835_gpio_fsel(CS, BCM2835_GPIO_FSEL_OUTP);
	bcm2835_gpio_fsel(HRDY, BCM2835_GPIO_FSEL_INPT);
	bcm2835_gpio_fsel(RESET, BCM2835_GPIO_FSEL_OUTP);

	bcm2835_gpio_write(CS, HIGH);

	printf("****** IT8951(3) ******\n");

	bcm2835_gpio_write(RESET, LOW);
	bcm2835_delay(100);
	bcm2835_gpio_write(RESET, HIGH);

	if(IT8951_Init())
	{
		printf("IT8951_Init error \n");
		return 1;
	}

	IT8951_GUI_Example();

	IT8951_Cancel();

	return 0;
}


