import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";

const bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: true
});

const GRUPO_ID = Number(process.env.GRUPO_ID);

let pendentes = 0;

/*
    userId => quantidade removida
    pelo último /add desse usuário
*/
const fluxoAdd = new Map();

const REGEX_ID =
    /\b[A-Z]{3}-[A-Z]{3}-[A-Z]{3}\b/g;

const REGEX_LINK =
    /smtt=0\.0\.9/i;

bot.on("message", async (msg) => {

    try {

        if (msg.chat.id !== GRUPO_ID)
            return;

        const texto = msg.text || "";
        const userId = msg.from?.id;

        // -----------------------
        // /fila
        // -----------------------

        if (/^\/fila\b/i.test(texto)) {

            await bot.sendMessage(
                GRUPO_ID,
                `📦 Pendentes: ${pendentes}`
            );

            return;
        }

        // -----------------------
        // /limpar
        // -----------------------

        if (/^\/limpar\b/i.test(texto)) {

            pendentes = 0;
            fluxoAdd.clear();

            return;
        }

        // -----------------------
        // /cancelar
        // -----------------------

        if (/^\/cancelar\b/i.test(texto)) {

            const qtd =
                fluxoAdd.get(userId);

            if (qtd) {

                pendentes += qtd;

                fluxoAdd.delete(userId);

                console.log(
                    `[CANCELADO] user=${userId} qtd=${qtd}`
                );
            }

            return;
        }

        // -----------------------
        // /add
        // -----------------------

        if (/^\/add\b/i.test(texto)) {

            if (!REGEX_LINK.test(texto))
                return;

            const ids =
                texto.match(REGEX_ID) || [];

            const qtd = ids.length;

            if (!qtd)
                return;

            pendentes =
                Math.max(
                    0,
                    pendentes - qtd
                );

            fluxoAdd.set(
                userId,
                qtd
            );

            console.log(
                `[ADD] user=${userId} qtd=${qtd} pendentes=${pendentes}`
            );

            return;
        }

        // -----------------------
        // entrada normal de IDs
        // -----------------------

        const ids =
            texto.match(REGEX_ID) || [];

        if (ids.length > 0) {

            pendentes += ids.length;

            console.log(
                `[ENTRADA] +${ids.length} | pendentes=${pendentes}`
            );
        }

    } catch (err) {

        console.error(err);
    }
});

// -----------------------
// alerta a cada 5 minutos
// -----------------------

setInterval(async () => {

    try {

        if (pendentes <= 0)
            return;

        await bot.sendMessage(
            GRUPO_ID,
            `⚠️ Existem ${pendentes} IDs aguardando processamento.`
        );

    } catch (err) {

        console.error(err);
    }

},10000);

console.log("Bot iniciado.");