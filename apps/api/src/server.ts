import { json, urlencoded } from 'body-parser';
import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

import Portabl, { EnvType, IAuthResponse, IKYCClaimsInput } from '@portabl/node';
import MOCKED_CLAIMS from './mocks/claims';
import MOCKED_NATIVE_USER_ID from './mocks/nativeUserId';

const PORTABL_CLIENT_ID = process.env.PORTABL_CLIENT_ID;
const PORTABL_CLIENT_SECRET = process.env.PORTABL_CLIENT_SECRET;
const PORTABL_ENV = process.env.PORTABL_ENV as EnvType;

if (typeof PORTABL_CLIENT_ID !== 'string') {
  throw new Error('No CLIENT_ID was provided in .env');
}

if (typeof PORTABL_CLIENT_SECRET !== 'string') {
  throw new Error('No CLIENT_SECRET was provided in .env');
}

// Define the portabl client
const portablClient = new Portabl({
  clientId: PORTABL_CLIENT_ID,
  clientSecret: PORTABL_CLIENT_SECRET,
  debug: true,
  env: PORTABL_ENV,
});

export const createServer = () => {
  const app = express();
  app
    .disable('x-powered-by')
    .use(morgan('dev'))
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(cors())
    .post('/prepare-backup', async (req, res, next) => {
      try {
        const { accessToken }: IAuthResponse = await portablClient.getAccessToken();

        return res.json({ accessToken });
      } catch (e) {
        next(e);
      }
    })
    .post('/load-backup-data', async (req, res, next) => {
      try {
        const { accessToken } = req.body;

        // Make a request to get claims from internal APIs
        const claims: IKYCClaimsInput = MOCKED_CLAIMS;
        // Make a request to get the native user id from internal APIs
        const nativeUserId: string = MOCKED_NATIVE_USER_ID;

        await portablClient.createCredential({
          accessToken,
          claims,
          nativeUserId,
        });

        return res.json({});
      } catch (e) {
        next(e);
      }
    })
    .get('/healthz', (_, res) => {
      return res.json({ ok: true });
    });

  return app;
};
