import express, { json, urlencoded, static as _static } from 'express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import indexRouter from './routes/index.js';
import notFoundRouter from './routes/notFound.js';

let app = express();

app.use(logger('dev'));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(_static(join(".", "public/")));

app.use(indexRouter);
app.use(notFoundRouter);

export default app;

