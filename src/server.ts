import express from "express";
import { PrismaClient } from "@prisma/client";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get("/movies", async (_, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: "asc",
        },
        include: {
            genres: true,
            languages: true
        }
    });
    res.json(movies);
});

app.post("/movies", async (req, res) => {

    const { title, genre_id, language_id, oscar_count, release_date } = req.body;

    try {

        // Verifica se já existe um registro com esse nome

        const movieWithSameTitle = await prisma.movie.findFirst({
            // Se o nome da variável for o MESMO da coluna, podemos omitir 1 deles;

            where: { title: { equals: title, mode: "insensitive" } }

            // Case insensitive significa que se a busca for feita por John Wick, john wick ou JOHN WICK, o registro vai ser retornado na consulta.
        });

        // Se já tiver o nome no banco, retorna erro 409

        if (movieWithSameTitle) {
            return res.status(409).send({ message: "Já existe um filme cadastrado com esse título" });
        }

        // O create é quem cria o novo registro na tabela.

        await prisma.movie.create({
            data: {
                title: title,
                genre_id: genre_id,
                language_id: language_id,
                oscar_count: oscar_count,
                // Aqui o mês começa em 0, então abril = 3
                release_date: new Date(release_date)
            }
        });
    } catch (error) {
        return res.status(500).send({ message: "Falha ao cadastrar um filme" });
    }

    res.status(201).send();
});

app.put("/movies/:id", async (req, res) => {
    // pegar o ID do registro que vai ser atualizado

    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id
            }
        });

        if (!movie) {
            return res.status(404).send({ message: "Filme não encontrado" });
        }

        const data = { ...req.body };
        data.release_date = data.release_date ? new Date(data.release_date) : undefined;

        // pegar os dados do filme que será atualizado e atualizar ele no prisma

        await prisma.movie.update({
            where: {
                id
            },
            data: data
        });
    } catch (error) {
        return res.status(500).send({ message: "Falha ao atualizar o registro do filme" });
    }

    // retornar o status correto informando que o filme foi atualizado

    res.status(200).send({ message: "Atualização do filme bem sucedida" });
});

app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`);
});