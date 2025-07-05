// --- GENERADOR DE CARDS Y DETALLE EN MODAL ---

function createPokemonCard(pokemonId) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://pokeapi.co/api/v2/pokemon/' + pokemonId, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);
            var pokemonName = response.name;
            var pokemonImage = response.sprites.front_default;
            var pokemonType = response.types.map(type => type.type.name).join(", ");

            var cardHTML = `
                <div class="col-6 col-sm-4 col-md-2">
                    <div class="card h-100 pokemon-card" style="cursor:pointer;" data-pokemon-id="${pokemonId}">
                        <img src="${pokemonImage}" class="card-img-top" alt="${pokemonName}">
                        <div class="card-body">
                            <h5 class="card-title">${pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1)}</h5>
                            <p class="card-text"><strong>Tipo:</strong> ${pokemonType}</p>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById("pokemon-cards-container").innerHTML += cardHTML;

            // Asignar evento click a todas las cards
            document.querySelectorAll('.pokemon-card').forEach(card => {
                card.onclick = function () {
                    const pid = this.getAttribute('data-pokemon-id');
                    showPokemonDetailsModal(pid);
                };
            });
        }
    };

    xhr.send();
}

// --- Función para mostrar el detalle en el modal ---
function showPokemonDetailsModal(pokemonId) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://pokeapi.co/api/v2/pokemon/' + pokemonId, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);

            var pokemonName = response.name;
            var pokemonImage = response.sprites.front_default;
            var pokemonTypes = response.types.map(type => type.type.name).join(" - ");
            var pokemonAbilities = response.abilities.map(ability => ability.ability.name).join(" - ");
            var pokemonMoves = response.moves.slice(0, 6).map(move => move.move.name).join(" - ");
            var pokemonHeight = response.height / 10; // en metros
            var pokemonWeight = response.weight / 10; // en kg
            var generation = Math.ceil(pokemonId / 151);

            var pokemonDetailsHTML = `
                <div class="container mt-2">
                    <h2 class="text-center mb-3">${pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1)}</h2>
                    <div class="row">
                        <div class="col-md-4 text-center">
                            <img src="${pokemonImage}" class="img-fluid" alt="${pokemonName}">
                        </div>
                        <div class="col-md-8">
                            <ul class="list-unstyled">
                                <li><strong>Generación:</strong> 0${generation}</li>
                                <li><strong>Pokémon ID #</strong> ${pokemonId}</li>
                                <li><strong>Peso:</strong> ${pokemonWeight} kgs</li>
                                <li><strong>Altura:</strong> ${pokemonHeight} mts</li>
                                <li><strong>Tipos:</strong> ${pokemonTypes}</li>
                                <li><strong>Habilidades:</strong> ${pokemonAbilities}</li>
                                <li><strong>Movimientos:</strong> ${pokemonMoves}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('pokemon-detail-modal-body').innerHTML = pokemonDetailsHTML;
            let modal = new bootstrap.Modal(document.getElementById('pokemonDetailModal'));
            modal.show();
        }
    };

    xhr.send();
}

// --- Lógica de generación y eventos del dropdown de generación ---
function fetchPokemonList(generation) {
    var startId = (generation - 1) * 151 + 1;
    var endId = generation * 151;
    document.getElementById("pokemon-cards-container").innerHTML = '';
    for (var i = startId; i <= endId; i++) {
        createPokemonCard(i);
    }
}

document.getElementById('generacionDropdown').addEventListener('change', function(event) {
    var generation = parseInt(event.target.value);
    document.getElementById("pokemon-cards-container").innerHTML = '';
    fetchPokemonList(generation);
});

window.addEventListener('DOMContentLoaded', function() {
    var defaultGeneration = 1;
    document.getElementById('generacionDropdown').value = defaultGeneration;
    fetchPokemonList(defaultGeneration);
});
