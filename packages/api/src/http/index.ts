import { Hono } from "hono";
import { authHttp } from "../features/auth";
import { orgsHttp } from "../features/orgs";
import { membersHttp } from "../features/members";
import { invitesHttp } from "../features/invites";

export const apiHttp = new Hono();

apiHttp.route("/auth", authHttp);
apiHttp.route("/orgs", orgsHttp);
apiHttp.route("/members", membersHttp);
apiHttp.route("/invites", invitesHttp);
