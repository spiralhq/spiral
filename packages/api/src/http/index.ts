import { Hono } from "hono";
import { authHttp } from "../features/auth";

export const apiHttp = new Hono();

apiHttp.route("/auth", authHttp);
