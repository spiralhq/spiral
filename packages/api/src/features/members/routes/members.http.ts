import { Hono } from "hono";

import { handleHttp } from "../../../core/http/handle";
import { requireSession } from "../../../core/http/middlewares/session";
import type { HttpAppEnv } from "../../../core/http/types";
import { parseQueryParams } from "../../../core/query";

import { ListMembersOutputDto, MemberFiltersDto } from "../dtos/list-members.dto";
import { listMembersUseCase } from "../use-cases/list-members.use-case";

export const membersHttp = new Hono<HttpAppEnv>();

membersHttp.use("*", requireSession);

membersHttp.get(
  "/",
  handleHttp(async (c) => {
    const session = c.var.session!;

    const rawParams: Record<string, string | undefined> = {
      page: c.req.query("page"),
      pageSize: c.req.query("pageSize"),
      sortBy: c.req.query("sortBy"),
      sortDir: c.req.query("sortDir"),
      q: c.req.query("q"),
      filters: c.req.query("filters"),
    };

    const queryParams = parseQueryParams(rawParams);

    let filters = undefined;
    if (queryParams.filters) {
      const parsed = MemberFiltersDto.safeParse(queryParams.filters);
      if (parsed.success) {
        filters = parsed.data;
      }
    }

    const data = await listMembersUseCase({
      organizationId: session.organizationId,
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      sortBy: queryParams.sortBy,
      sortDir: queryParams.sortDir,
      q: queryParams.q,
      filters,
    });

    return c.json(ListMembersOutputDto.parse(data));
  }),
);
