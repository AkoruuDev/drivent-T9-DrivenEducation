import { Hotel } from '@prisma/client';
import { notFoundError } from '@/errors';
import hotelsRepository from '@/repositories/hotels-repository';

async function getHotels(): Promise<Hotel[]>{
  const hotels: Hotel[] = await hotelsRepository.findHotels();
  if (!hotels) throw notFoundError();

  return hotels;
};

async function getHotelById(hotelId: number): Promise<Hotel> {
    const hotelSelected: Hotel = await hotelsRepository.findHotelById(hotelId);
    if (!hotelSelected) throw notFoundError();

    return hotelSelected;
};

const hotelsService = { getHotels, getHotelById };

export default hotelsService;
