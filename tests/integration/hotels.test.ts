import jwt from "jsonwebtoken";
import app, { init } from "@/app";
import { cleanDb, generateValidToken } from "../helpers";
import supertest from "supertest";
import httpStatus from "http-status";
import faker from "@faker-js/faker";
import { createEnrollmentWithAddress, createHotel, createPayment, createRoomWithHotelId, createTicket, createTicketTypeRemote, createTicketTypeWithHotel, createUser } from "../factories";
import { TicketStatus } from "@prisma/client";

beforeAll(async () => {
    await init();
});

beforeEach(async () => {
    await cleanDb();
});

const server = supertest(app);

async function createNewFakerUser() {
    const fakerUser = await createUser();
    const token = await generateValidToken(fakerUser);
    const enrollment = await createEnrollmentWithAddress(fakerUser);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createPayment(ticket.id, ticketType.price);

    return token;
}

describe(`GET /hotels`, () => {
    it(`should respond with status 401 if no token doens't exist`, async () => {
        const response = await server.get(`/hotels`);
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it(`should respond with status 401 if given token isn't valid`, async () => {
        const token = faker.lorem.word();

        const response = await server.get(`/hotels`).set(`Authorization`, `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it(`should respond with status 401 if user has no be logged in session`, async () => {
        const fakerUser = await createUser();
        const token = jwt.sign({ userId: fakerUser.id }, process.env.JWT_SECRET);

        const response = await server.get(`/hotels`).set(`Authorization`, `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe(`When token is valid`, () => {
        it(`Should respond with status 404 when user ticket is remote`, async () => {
            const token = await createNewFakerUser();

            const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });

        it(`should respond with status 404 when user has no enrollment`, async () => {
            const fakerUser = await createUser();
            const token = await generateValidToken(fakerUser);

            await createTicketTypeRemote();

            const response = await server.get(`/hotels`).set(`Authorization`, `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });

        it(`should respond with status 200 and the hotels list`, async () => {
            const token = await createNewFakerUser()
            const createdHotel = await createHotel();

            const response = await server.get(`/hotels`).set(`Authorization`, `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.OK);
            expect(response.body).toEqual([
                {
                    id: createdHotel.id,
                    name: createdHotel.name,
                    image: createdHotel.image,
                    createdAt: createdHotel.createdAt.toISOString(),
                    updatedAt: createdHotel.updatedAt.toISOString(),
                },
            ]);
        });

        it(`should respond with status 404 and an empty array`, async () => {
            const token = createNewFakerUser();

            const response = await server.get(`/hotels`).set(`Authorization`, `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.NOT_FOUND);
            expect(response.body).toEqual([]);
        });
    });
});

describe(`GET /hotels/:hotelId`, () => {
    it(`Should respond with status 401 if no token doesn't exist`, async () => {
        const response = await server.get(`/hotels/1`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it(`Should respond with status 401 if given token isn't valid`, async () => {
        const token = faker.lorem.word();

        const response = await server.get(`/hotels/1`).set(`Authorization`, `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it(`Should respond with status 401 if doesn't exist session for given token`, async () => {
        const fakerUser = await createUser();
        const token = jwt.sign({ userId: fakerUser.id }, process.env.JWT_SECRET);

        const response = await server.get(`/hotels/1`).set(`Authorization`, `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe(`When token is valid`, () => {
        it(`Should respond with status 404 when is a remote user`, async () => {
            const token = createNewFakerUser();
            const response = await server.get(`/hotels/1`).set(`Authorization`, `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });

        it(`Should respond with status 404 when user has no enrollment`, async () => {
            const user = await createUser();
            const token = await generateValidToken(user);

            await createTicketTypeRemote();

            const response = await server.get(`/hotels/1`).set(`Authorization`, `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });

        it(`Should respond with status 404 for invalid hotel id`, async () => {
            const token = createNewFakerUser();
            await createHotel();

            const response = await server.get(`/hotels/0`).set(`Authorization`, `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });

        it(`Should respond with status 200 and hotel with rooms`, async () => {
            const token = createNewFakerUser();
            const createdHotel = await createHotel();
            const createdRoom = await createRoomWithHotelId(createdHotel.id);
            const response = await server.get(`/hotels/${createdHotel.id}`).set(`Authorization`, `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.OK);
            expect(response.body).toEqual({
                id: createdHotel.id,
                name: createdHotel.name,
                image: createdHotel.image,
                createdAt: createdHotel.createdAt.toISOString(),
                updatedAt: createdHotel.updatedAt.toISOString(),
                Rooms: [{
                    id: createdRoom.id,
                    name: createdRoom.name,
                    capacity: createdRoom.capacity,
                    hotelId: createdHotel.id,
                    createdAt: createdRoom.createdAt.toISOString(),
                    updatedAt: createdRoom.updatedAt.toISOString(),
                }],
            });
        });

        it(`Should respond with status 404 and hotel without rooms`, async () => {
            const token = createNewFakerUser();
            const createdHotel = await createHotel();
            const response = await server.get(`/hotels/${createdHotel.id}`).set(`Authorization`, `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.NOT_FOUND);
            expect(response.body).toEqual({
                id: createdHotel.id,
                name: createdHotel.name,
                image: expect.any(String),
                createdAt: createdHotel.createdAt.toISOString(),
                updatedAt: createdHotel.updatedAt.toISOString(),
                Rooms: [],
            });
        });
    });
});
  