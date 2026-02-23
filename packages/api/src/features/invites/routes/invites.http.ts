import { Hono } from "hono";

import { handleHttp } from "../../../core/http/handle";
import { parseJson } from "../../../core/http/parse";
import { requireSession } from "../../../core/http/middlewares/session";
import type { HttpAppEnv } from "../../../core/http/types";
import { AppError } from "../../../core/errors/app-error";

import { CreateInviteInputDto, CreateInviteOutputDto } from "../dtos/create-invite.dto";
import { createInviteUseCase } from "../use-cases/create-invite.use-case";

const ADMIN_ROLE = 1;

export const invitesHttp = new Hono<HttpAppEnv>();

invitesHttp.use("*", requireSession);

invitesHttp.post(
  "/",
  handleHttp(async (c) => {
    const session = c.var.session!;

    if (session.role !== ADMIN_ROLE) {
      throw new AppError("FORBIDDEN", "errors.auth.forbidden");
    }

    const input = await parseJson(c, CreateInviteInputDto);

    const data = await createInviteUseCase({
      email: input.email,
      role: input.role,
      organizationId: session.organizationId,
    });

    return c.json(CreateInviteOutputDto.parse(data));
  }),
);
