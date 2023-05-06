import hotelsService from "@/services/hotels-service";
import { Hotel } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

export async function getHotels(req: Request, res: Response, next: NextFunction): Promise<Response> {
    try {
      const hotel: Hotel[] = await hotelsService.getHotels();
      return res.status(httpStatus.OK).send(hotel);
    } catch (e) {
      next(e);
    }    
};

export async function getHotelById(req: Request, res: Response, next: NextFunction): Promise<Response> {
    const { hotelId } = req.params as { hotelId: string };
  
    try {
      const hotelSelected: Hotel = await hotelsService.getHotelById(Number(hotelId));
      return res.status(httpStatus.OK).send(hotelSelected);
    } catch (e) {
      next(e);
    }
};