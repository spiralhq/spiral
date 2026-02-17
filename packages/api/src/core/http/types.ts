import type { Context as TrpcContext } from "../context";

export type HttpSession = TrpcContext["session"];

export type HttpAppEnv = {
  Variables: {
    session: HttpSession;
  };
};
