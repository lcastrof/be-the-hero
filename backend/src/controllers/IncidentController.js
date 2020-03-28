const connection = require('../database/connection');

module.exports = {
    async index(request, response) {
        const { page = 1 } = request.query;  // paginação

        //total de casos
        const [count] = await connection('incidents').count() // [count] pega o primeiro resultado do array e armazena na variavel count
        
        const incidents = await connection('incidents')
         .join('ongs', 'ongs.id', '=', 'incidents.ong_id') // trazendo os dados da ong_id em ongs, ou seja, acoplando os dados da ong ao seu caso
         .limit(5)
         .offset((page-1)*5) //pulando os x primeiros registros e pegando os ademais adiante
         .select(['incidents.*', 
         'ongs.name', 
         'ongs.email', 
         'ongs.whatsapp', 
         'ongs.city', 
         'ongs.uf']); // selecionando os campos que quer trazer da ong, já que elatambém tem um campo de id e sobrepõe o outro

        response.header('X-Total-Count', count['count(*)']);

        return response.json(incidents);
    },
    
    async create(request, response) {
        const { title, description, value } = request.body;
        const ong_id = request.headers.authorization;

        const [id] = await connection('incidents').insert({ // o primeiro valor desse array vai ser armazenado em id
            title,
            description,
            value,
            ong_id
        });

        return response.json({ id }); // fica com chave pro frontend saber o nome da info retornando, no caso id
    },

    async delete(request, response) {
        const { id } = request.params;
        const ong_id = request.headers.authorization;

        const incident = await connection('incidents')
         .where('id', id)
         .select('ong_id')
         .first();

        if(incident.ong_id != ong_id) {
            return response.status(401).json({ error: 'Operation not allowed.' });
        }

        await connection('incidents').where('id', id).delete();

        return response.status(204).send();
    }
}