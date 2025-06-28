// Obtener el ID del Pokémon desde la URL
const urlParams = new URLSearchParams(window.location.search);
const pokemonId = urlParams.get('id');

// Obtener los detalles del Pokémon usando su ID
var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://pokeapi.co/api/v2/pokemon/' + pokemonId, true);

xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
        // Parsear la respuesta JSON
        var response = JSON.parse(xhr.responseText);

        // Extraer los datos necesarios
        var pokemonName = response.name;
        var pokemonImage = response.sprites.front_default;
        var pokemonTypes = response.types.map(type => type.type.name).join(" - ");
        var pokemonAbilities = response.abilities.map(ability => ability.ability.name).join(" - ");
        var pokemonMoves = response.moves.slice(0, 6).map(move => move.move.name).join(" - ");
        var pokemonHeight = response.height / 10; // en metros
        var pokemonWeight = response.weight / 10; // en kg

        // La generación se puede obtener calculando en qué rango de ID cae
        var generation = Math.ceil(pokemonId / 151);  // Asumiendo que cada generación tiene 151 Pokémon

        // Crear el HTML con los detalles del Pokémon
        var pokemonDetailsHTML = `
            <div class="container mt-4">
                <h2 class="text-center mb-4">${pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1)}</h2>
                <div class="row">
                    <div class="col-md-4 text-center">
                        <img src="${pokemonImage}" class="img-fluid" alt="${pokemonName}">
                    </div>
                    <div class="col-md-8">
                        <ul class="list-unstyled">
                            <li><strong>Generation:</strong> 0${generation}</li>
                            <li><strong>Pokémon ID #</strong>${pokemonId}</li>
                            <li><strong>Weight:</strong> ${pokemonWeight} kgs</li>
                            <li><strong>Height:</strong> ${pokemonHeight} mts</li>
                            <li><strong>Types:</strong> ${pokemonTypes}</li>
                            <li><strong>Abilities:</strong> ${pokemonAbilities}</li>
                            <li><strong>Moves:</strong> ${pokemonMoves}</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // Insertar los detalles en el contenedor
        document.getElementById('pokemon-detail-container').innerHTML = pokemonDetailsHTML;
    }
};

xhr.send();
