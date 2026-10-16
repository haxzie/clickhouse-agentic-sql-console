import request from 'supertest';
import { describe, it, expect } from 'vitest';

import app from "./server";

describe('GET /', () => {
    it('should return Hello world!', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
        expect(response.text).toBe('Hello world!');
    });
});
