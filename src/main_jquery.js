// ATENÇÃO
// Para funcionar será necessário:
// 1º: Crie uma conta e um token em https://advisor.climatempo.com.br/
// 2º: Crie um projeto na conta.
// 3º: Inicialize a variável tokenClimaTempo com o disponibilizado para o token do projeto.

const tokenClimaTempo = "";

var states = [];
var cities = [];


function countrySynopticAnalysis() {
  var text = "";

  $.getJSON(
    `http://apiadvisor.climatempo.com.br/api/v1/anl/synoptic/locale/BR?token=${tokenClimaTempo}`,
    "",
    function(data, status, xhr){
      if(status !== 'success')
        text = 'Não foi possível obter a análise sinótica meteorológica do paí­s.';
      else if(data.length == 0)
        text = "Análise sinótica meteorológica não disponível.";
      else
        text = data[0].text;

      $("#countrySynopticAnalysis").append( text );
    });
};

countrySynopticAnalysis();

async function findCityId(cityName, UF) {
  if(cityName == null)
    return;

  var cityId = 0;

  await $.getJSON(
    `http://apiadvisor.climatempo.com.br/api/v1/locale/city?name=${cityName.toLowerCase()}&state=${UF}&token=${tokenClimaTempo}`,
    "",
    function(data, status, xhr){
      if(status !== 'success'){
        alert('Não foi possível obter as informações da cidade.');
        return;
      }

      cityId = data.find( it => it.name.toUpperCase() === cityName.toUpperCase() ).id;
    }
  );

  return cityId;
};

async function registerCity(cityId) {
  if(cityId == null)
    return;

  try {
    const response = await $.ajax({
      type: "PUT",
      url: `https://cors-anywhere.herokuapp.com/http://apiadvisor.climatempo.com.br/api-manager/user-token/${tokenClimaTempo}/locales`,
      data: `localeId[]=${cityId}`
    });
    console.log(response);
  } catch(error) {
    console.log(error);
  }
};

async function currentWeatherByCity() {
  var cityName = $("#city").val();
  var ufId = $("select#state").val();
  var ufSigla = states.find( it => it.id == ufId ).sigla;
  var cityId = await findCityId(cityName, ufSigla);

  if(cityId == null){
    alert('Cidade não localizada.');
    return;
  }

  await registerCity(cityId);

  $.getJSON(
    `http://apiadvisor.climatempo.com.br/api/v1/weather/locale/${cityId}/current?token=${tokenClimaTempo}`,
    "",
    function(data, status, xhr){
      if(status !== 'success'){
        alert('Não foi possível obter as informações meteorológicas da cidade.');
        return;
      }

      const {condition, date, humidity, sensation, temperature} = data.data;
      const options = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' };

      const event = new Date(date);

      $("#analysis").text('');
      $("#analysis").append( `Condições Climáticas às ${event.toLocaleDateString('pt-BR', options)}</br>` );
      $("#analysis").append( `${condition}</br>` );
      $("#analysis").append( `Umidade: ${humidity}</br>` );
      $("#analysis").append( `Sensação Térmica: ${sensation}</br>` );
      $("#analysis").append( `Temperatura: ${temperature} °C</br>` );
      $("div#cityAnalysis").attr('hidden', false);
    }
  );
}

function fillState() {
  $.getJSON(
    "https://servicodados.ibge.gov.br/api/v1/localidades/estados", 
    "",
    function(data, status, xhr){
      if(status !== 'success'){
        alert('Não foi possível obter a lista de Estados.');
        return;
      }

      states = data.map( it => ({id: it.id, sigla: it.sigla}) );

      data.sort( (a, b) => (a.sigla.toUpperCase() < b.sigla.toUpperCase() ? -1 : 1) );
      data.forEach(item => $("select#state").append( new Option(item.sigla, item.id) ) );
    });
};

fillState();

function fillCity() {
  var UF = $("select#state").val();
  if(UF == null)
    return;

  $.getJSON(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${UF}/municipios`,
    "",
    function(data, status, xhr){
      if(status !== 'success'){
        alert('Não foi possível obter a lista de Cidades.');
        return;
      }

      cities = data.map( it => ({id: it.id, nome: it.nome}) );
    });
};

function findCity() {
  var city = $("#city").val();

  if(city == null || city.length < 3)
    return;

  $("ul#listCities").empty();

  cities.forEach( it => {
    if(it.nome.toUpperCase().substring(0, city.length) === city.toUpperCase()) {
      $("ul#listCities").append( `<li><a href="#" onclick="selectCity(event)" id="${it.id}">${it.nome}</a></li>` );
    }
  });
};

function selectCity(event) {
  let cityId = event.target.id;
  let cityName = event.target.innerText;
  $("#city").val( cityName );
  // $("#city").attr( 'cityid', cityId );
  $("ul#listCities").empty();
  currentWeatherByCity();
};
