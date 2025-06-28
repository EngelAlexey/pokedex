// Función para crear las cartas de Pokémon
function createPokemonCard(pokemonId) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://pokeapi.co/api/v2/pokemon/' + pokemonId, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            // Parsear la respuesta JSON
            var response = JSON.parse(xhr.responseText);
            
            // Extraer los datos necesarios
            var pokemonName = response.name;
            var pokemonImage = response.sprites.front_default;
            var pokemonType = response.types.map(type => type.type.name).join(", ");
            
            // Crear la card HTML
            var cardHTML = `
                <div class="col-6 col-sm-4 col-md-2">
                    <a href="pokemon-details.html?id=${pokemonId}" class="card-link">
                        <div class="card h-100">
                            <img src="${pokemonImage}" class="card-img-top" alt="${pokemonName}">
                            <div class="card-body">
                                <h5 class="card-title">${pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1)}</h5>
                                <p class="card-text"><strong>Tipo:</strong> ${pokemonType}</p>
                            </div>
                        </div>
                    </a>
                </div>
            `;
            
            // Insertar la card en el contenedor
            document.getElementById("pokemon-cards-container").innerHTML += cardHTML;
        }
    };

    xhr.send();
}

// Función para obtener la lista de Pokémon por generación
function fetchPokemonList(generation) {
    var startId = (generation - 1) * 151 + 1; // Calcular el primer ID de la generación
    var endId = generation * 151; // Calcular el último ID de la generación

    for (var i = startId; i <= endId; i++) {
        createPokemonCard(i);
    }
}

// Escuchar el cambio en el dropdown de la generación
document.getElementById('generacionDropdown').addEventListener('change', function(event) {
    var generation = parseInt(event.target.value);
    document.getElementById("pokemon-cards-container").innerHTML = ''; // Limpiar las cartas anteriores
    fetchPokemonList(generation); // Obtener los Pokémon de la generación seleccionada
});

// Ejecutar la función de carga inicial cuando la página cargue, forzando el "change" al primer valor
window.addEventListener('DOMContentLoaded', function() {
    var defaultGeneration = 1; // Establecer la generación predeterminada (Primera)
    document.getElementById('generacionDropdown').value = defaultGeneration;
    fetchPokemonList(defaultGeneration); // Cargar los Pokémon de la primera generación
});
