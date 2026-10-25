type Token =
| { kind: "C"; bn: string }
| { kind: "V"; ind: string; sign: string }
| { kind: "NG" }
| { kind: "J" }
| { kind: "W" };

const C = (bn: string): Token => ({ kind: "C", bn });
const V = (ind: string, sign: string): Token => ({ kind: "V", ind, sign });

// Lomba symbol age (longest match), tarpor chhoto symbol
const TABLE: [string, Token | Token[]][] = [
// affricate ar diphthong
["tʃ", C("চ")],
["dʒ", C("জ")],
["eɪ", V("এই", "েই")],
["aɪ", V("আই", "াই")],
["ɔɪ", V("অয়", "য়")],
["aʊ", V("আউ", "াউ")],
["əʊ", V("ও", "ো")],
["oʊ", V("ও", "ো")],
["ɪə", V("ইয়ার", "িয়ার")],
["eə", V("এয়ার", "েয়ার")],
["ʊə", V("উয়ার", "ুয়ার")],

// consonant
["p", C("প")],
["b", C("ব")],
["t", C("ট")],
["d", C("ড")],
["k", C("ক")],
["g", C("গ")],
["ɡ", C("গ")],
["f", C("ফ")],
["v", C("ভ")],
["θ", C("থ")],
["ð", C("দ")],
["s", C("স")],
["z", C("জ")],
["ʃ", C("শ")],
["ʒ", C("জ")],
["h", C("হ")],
["m", C("ম")],
["n", C("ন")],
["l", C("ল")],
["ɫ", C("ল")],
["ɹ", C("র")],
["r", C("র")],
["ɾ", C("ড")],
["x", C("খ")],
["ŋ", { kind: "NG" }],
["j", { kind: "J" }],
["w", { kind: "W" }],

// vowel
["i", V("ই", "ি")],
["ɪ", V("ই", "ি")],
["e", V("এ", "ে")],
["ɛ", V("এ", "ে")],
["æ", V("অ্যা", "্যা")],
["a", V("আ", "া")],
["ɑ", V("আ", "া")],
["ʌ", V("আ", "া")],
["ɐ", V("আ", "া")],
["ə", V("আ", "া")],
["ɜ", V("আ", "া")],
["ɚ", [V("আ", "া"), C("র")]],
["ɝ", [V("আ", "া"), C("র")]],
["ɒ", V("অ", "")],
["ɔ", V("অ", "")],
["o", V("ও", "ো")],
["ʊ", V("উ", "ু")],
["u", V("উ", "ু")],
];

const SORTED = [...TABLE].sort((a, b) => b[0].length - a[0].length);

function tokenize(ipa: string): Token[] {
const tokens: Token[] = [];
let i = 0;

while (i < ipa.length) {
    const match = SORTED.find(([symbol]) => ipa.startsWith(symbol, i));
    if (match) {
    tokens.push(...(Array.isArray(match[1]) ? match[1] : [match[1]]));
    i += match[0].length;
    } else {
    i += 1; // stress mark, length mark, bracket skip
    }
}

return tokens;
}

export function ipaToBengali(ipa: string): string {
if (!ipa) return "";

const tokens = tokenize(ipa.replace(/[/\[\]]/g, ""));
let out = "";
let last: "start" | "C" | "V" | "other" = "start";

for (const token of tokens) {
    switch (token.kind) {
    case "C": {
        if (last === "C") out += "্";
        out += token.bn;
        last = "C";
        break;
    }
    case "V": {
        out += last === "C" ? token.sign : token.ind;
        last = "V";
        break;
    }
    case "NG": {
        out += "ং";
        last = "other";
        break;
    }
    case "J": {
        out += last === "C" ? "্য" : "ইয়";
        last = "C";
        break;
    }
    case "W": {
        out += last === "C" ? "্ব" : "ওয়";
        last = "C";
        break;
    }
    }
}

return out;
}