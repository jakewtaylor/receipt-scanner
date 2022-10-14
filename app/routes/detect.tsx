import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import React from "react";
import { createWorker } from "tesseract.js";

const worker = createWorker({
  logger: (m) => console.log(m),
});

type ActionData = {
  detectedText: string;
  image: string;
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  const img = formData.get("image");

  if (!img || typeof img !== "string") return null;

  await worker.load();
  await worker.loadLanguage("eng");
  await worker.initialize("eng");

  const {
    data: { text },
  } = await worker.recognize(img);

  await worker.terminate();

  return json<ActionData>({
    detectedText: text,
    image: img,
  });
};

const currencyFormat = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export default function Detect() {
  const data = useActionData<ActionData>();

  if (!data) return null;

  const str = data.detectedText;
  const lines = str.split("\n").filter(Boolean);

  const parsedLines = lines.map((line) => {
    const lineRegex = /^(.+) (.+) £([^a-zA-Z]+).*$/i;
    const priceRegex = /^(\d+)[^\d]+(\d+)$/;

    const match = line.match(lineRegex);

    if (match) {
      const [full, name, , price] = match;

      const priceMatch = price.match(priceRegex);
      let parsedPrice = null;

      if (priceMatch) {
        const [, a, b] = priceMatch;

        parsedPrice = parseFloat(`${a}.${b}`);
      }

      return { full, name, priceString: price, price: parsedPrice };
    }

    return { full: line };
  });

  const total =
    parsedLines
      .map(({ price }) => (price ? price * 100 : 0))
      .reduce((acc, price) => {
        return acc + price;
      }, 0) / 100;

  return (
    <div className="grid grid-cols-2">
      <img src={data.image} alt="uploaded pic" />

      <div>
        <table className="w-11/12 mx-auto table-auto">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left">Item</th>
              <th className="text-right">Price</th>
            </tr>
          </thead>
          <tbody className="border-x border-black">
            {parsedLines.map(({ full, name, priceString, price }) => (
              <tr key={full} className="border-b border-black">
                <td>{name || full}</td>
                <td className="text-right">
                  {price ? currencyFormat.format(price) : priceString || "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-b border-black">
              <td></td>
              <td className="text-right">{currencyFormat.format(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
