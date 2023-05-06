import { prisma } from '@/config';
import { Hotel } from '@prisma/client';

async function findHotels (): Promise<Hotel[]> {
    return prisma.hotel.findMany();
};

async function findHotelById (id: number): Promise<Hotel> {
    return prisma.hotel.findFirst({
        where: {
          id,
        },
    });
};

const hotelsRepository = {
    findHotels,
    findHotelById
}
export default hotelsRepository;
