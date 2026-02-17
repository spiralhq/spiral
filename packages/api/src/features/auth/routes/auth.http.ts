import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";

import { handleHttp } from "../../../core/http/handle";
import { parseJson } from "../../../core/http/parse";

import { RequestChallengeInputDto, RequestChallengeOutputDto } from "../dtos/request-challenge.dto";
import { VerifyInputDto } from "../dtos/verify.dto";
import { requestChallengeUseCase } from "../use-cases/request-challenge.use-case";
import { verifyUseCase } from "../use-cases/verify.use-case";
import { logoutUseCase } from "../use-cases/logout.use-case";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "./session-cookie";
import type { HttpAppEnv } from "../../../core/http/types";
import { requireSession, sessionMiddleware } from "../../../core/http/middlewares/session";

export const authHttp = new Hono<HttpAppEnv>();

authHttp.use("*", sessionMiddleware);

authHttp.post(
  "/request-challenge",
  handleHttp(async (c) => {
    const input = await parseJson(c, RequestChallengeInputDto);
    const data = await requestChallengeUseCase(input);
    return c.json(RequestChallengeOutputDto.parse(data));
  }),
);

authHttp.post(
  "/verify",
  handleHttp(async (c) => {
    const input = await parseJson(c, VerifyInputDto);
    const { token } = await verifyUseCase(input);

    setCookie(c, SESSION_COOKIE_NAME, token, sessionCookieOptions());
    return c.json({ success: true as const });
  }),
);

authHttp.post(
  "/logout",
  requireSession,
  handleHttp(async (c) => {
    await logoutUseCase();

    deleteCookie(c, SESSION_COOKIE_NAME, sessionCookieOptions());
    return c.json({ success: true as const });
  }),
);
