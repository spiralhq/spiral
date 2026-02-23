import { Hono } from "hono";
import { setCookie } from "hono/cookie";

import { handleHttp } from "../../../core/http/handle";
import { parseJson } from "../../../core/http/parse";
import { requireSession } from "../../../core/http/middlewares/session";
import type { HttpAppEnv } from "../../../core/http/types";

import { ListMineOutputDto } from "../dtos/list-mine.dto";
import { SwitchOrgInputDto } from "../dtos/switch.dto";
import { listMyOrganizationsUseCase } from "../use-cases/list-my-organizations.use-case";
import { switchOrganizationUseCase } from "../use-cases/switch-organization.use-case";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "../../auth/routes/session-cookie";

export const orgsHttp = new Hono<HttpAppEnv>();

orgsHttp.use("*", requireSession);

orgsHttp.get(
  "/mine",
  handleHttp(async (c) => {
    const session = c.var.session!;
    const data = await listMyOrganizationsUseCase({
      publicKey: session.publicKey,
      currentOrganizationId: session.organizationId,
    });
    return c.json(ListMineOutputDto.parse(data));
  }),
);

orgsHttp.post(
  "/switch",
  handleHttp(async (c) => {
    const session = c.var.session!;
    const input = await parseJson(c, SwitchOrgInputDto);

    const { token } = await switchOrganizationUseCase({
      publicKey: session.publicKey,
      organizationId: input.organizationId,
    });

    setCookie(c, SESSION_COOKIE_NAME, token, sessionCookieOptions());
    return c.json({ success: true as const });
  }),
);
