import { Connection, PublicKey } from "@solana/web3.js";
import { env } from "@spiral/env/server";

export const solanaGateway = {
  async resolveMemberPda(input: {
    organizationPda: string;
    userPublicKey: string;
  }): Promise<string> {
    const [memberPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("member"),
        new PublicKey(input.organizationPda).toBuffer(),
        new PublicKey(input.userPublicKey).toBuffer(),
      ],
      new PublicKey(env.ORGANIZATION_PROGRAM_ID),
    );

    return memberPda.toBase58();
  },

  async memberPdaExists(input: { memberPda: string }): Promise<boolean> {
    const connection = new Connection(env.SOLANA_RPC_URL);
    const info = await connection.getAccountInfo(new PublicKey(input.memberPda));
    return !!info;
  },
};
