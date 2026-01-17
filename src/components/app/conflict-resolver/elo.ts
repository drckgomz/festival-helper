// src/components/app/conflict-resolver/elo.ts
export function expectedScore(rA: number, rB: number) {
	return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}

export function updateElo(rA: number, rB: number, winner: "A" | "B", k = 24) {
	const eA = expectedScore(rA, rB);
	const eB = expectedScore(rB, rA);
	const sA = winner === "A" ? 1 : 0;
	const sB = winner === "B" ? 1 : 0;
	return {
		nextA: rA + k * (sA - eA),
		nextB: rB + k * (sB - eB),
	};
}
