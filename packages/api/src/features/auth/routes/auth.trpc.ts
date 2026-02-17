import { setCookie, deleteCookie } from "hono/cookie";

import { RequestChallengeInputDto, RequestChallengeOutputDto } from "../dtos/request-challenge.dto";
import { VerifyInputDto, VerifyOutputDto } from "../dtos/verify.dto";
import { MeOutputDto } from "../dtos/me.dto";

import { requestChallengeUseCase } from "../use-cases/request-challenge.use-case";
import { verifyUseCase } from "../use-cases/verify.use-case";
import { getMeUseCase } from "../use-cases/get-me.use-case";
import { logoutUseCase } from "../use-cases/logout.use-case";

import { protectedProcedure, publicProcedure } from "../../../core/trpc/procedures";
import { trpcTry } from "../../../core/trpc/catch";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "./session-cookie";
import { router } from "../../../core/trpc/init";

export const authRouter = router({
  requestChallenge: publicProcedure
    .input(RequestChallengeInputDto)
    .output(RequestChallengeOutputDto)
    .mutation(({ input }) => trpcTry(() => requestChallengeUseCase(input))),

  verify: publicProcedure
    .input(VerifyInputDto)
    .output(VerifyOutputDto)
    .mutation(({ input, ctx }) =>
      trpcTry(async () => {
        const { token } = await verifyUseCase(input);
        setCookie(ctx.hono, SESSION_COOKIE_NAME, token, sessionCookieOptions());
        return { success: true as const };
      }),
    ),

  getMe: protectedProcedure.output(MeOutputDto).query(({ ctx }) =>
    trpcTry(() =>
      getMeUseCase({
        publicKey: ctx.session.publicKey,
        organizationId: ctx.session.organizationId,
      }),
    ),
  ),

  logout: protectedProcedure.mutation(({ ctx }) =>
    trpcTry(async () => {
      await logoutUseCase();
      deleteCookie(ctx.hono, SESSION_COOKIE_NAME, sessionCookieOptions());
      return { success: true as const };
    }),
  ),
});
