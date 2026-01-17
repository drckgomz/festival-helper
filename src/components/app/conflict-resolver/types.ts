// src/components/app/conflict-resolver/types.ts
export type SetInput = {
	setId: string;
	artistId: string;
	artistName: string;
	artistImageUrl: string | null;
	stageName: string;
	startsAt: string; // ISO
	endsAt: string; // ISO
};

export type SetLite = {
	setId: string;
	artistId: string;
	artistName: string;
	artistImageUrl: string | null;
	stageName: string;
	startsAt: Date;
	endsAt: Date;
};

export type Pair = {
	aId: string;
	bId: string;
};

export type Vote = {
	aId: string;
	bId: string;
	winnerId: string;
	loserId: string;
	ts: number;
};
