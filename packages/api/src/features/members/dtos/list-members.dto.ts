import { z } from "zod";
import { createQueryInputDto, createQueryResultDto } from "../../../core/query";

export const MemberSortByValues = ["name", "role", "publicKey", "createdAt"] as const;
export type MemberSortBy = (typeof MemberSortByValues)[number];

export const MemberFiltersDto = z.object({
  role: z.union([z.literal(1), z.literal(2)]).optional(),
  hasPda: z.boolean().optional(),
});

export type MemberFilters = z.infer<typeof MemberFiltersDto>;

export const MemberItemDto = z.object({
  userPublicKey: z.string(),
  name: z.string().nullable(),
  role: z.number(),
  pda: z.string().nullable(),
  createdAt: z.coerce.date().optional(),
});

export type MemberItem = z.infer<typeof MemberItemDto>;

export const ListMembersInputDto = createQueryInputDto(MemberSortByValues).extend({
  filters: MemberFiltersDto.optional(),
});

export type ListMembersInput = z.infer<typeof ListMembersInputDto>;

export const ListMembersOutputDto = createQueryResultDto(MemberItemDto);

export type ListMembersOutput = z.infer<typeof ListMembersOutputDto>;

export const ListMembersArrayOutputDto = z.array(MemberItemDto);

export type ListMembersArrayOutput = z.infer<typeof ListMembersArrayOutputDto>;
