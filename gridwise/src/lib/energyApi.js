export async function fetchNextHourPrediction(input) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch prediction");
  }

  return res.json();
}