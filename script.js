var water_temp = 20;
var battery = 0;
var max_photovoltaik;

var photovoltaik;
var household_consumption;
var pointer = 0;

var electricity_cost = 0;
var electricity_revenue = 0;


var time_resolution = 1;

function start_simulation(){
  simulate_one_section();
}

$( document ).ready(function() {
  console.log('document ready');
  time_resolution = document.getElementById('time_resolution').value

  // read in data files
  document.getElementById('photovoltaik').onchange = function(){
    var file = this.files[0];
    var reader = new FileReader();
    reader.onload = function(progressEvent){
      console.log('file was read in');
      photovoltaik = this.result.split('\n').map(function (x) {
        return parseInt(x);
      });;
      max_photovoltaik = Math.max.apply(Math, photovoltaik);
    };
    reader.readAsText(file);
  };

  document.getElementById('household_consumption').onchange = function(){
    var file = this.files[0];
    var reader = new FileReader();
    reader.onload = function(progressEvent){
      console.log('file was read in');
      household_consumption = this.result.split('\n');
    };
    reader.readAsText(file);
  };
});

function simulate_one_section(){
  current_usage = household_consumption[pointer];
  $('input[name=household_consumption_kw]').val(current_usage);

  current_photovoltaik = Math.round(photovoltaik[pointer]/(max_photovoltaik/1000)*$('input[name=photovoltaik_kwp]').val());

  $('.meter_photovoltaik_kwp > .text').html(current_photovoltaik + ' watt');
  pointer++;

  battery_max_size = $('input[name=battery_kwh]').val();
  water_storage_size = $('input[name=meter_water_qm]').val();

  current_need = (current_photovoltaik - current_usage ) / (60 * time_resolution)

  if (battery + current_need >= 0 && battery + current_need <= battery_max_size){
    battery = battery + current_need;
    current_need = 0;
  }

  if(current_need < 0){
    electricity_cost = electricity_cost + (current_need*-1) * $('input[name=price_kwh]').val();
  }else{
    electricity_revenue = electricity_revenue + current_need * $('input[name=price_export_kwh]').val();
  }

  $('input[name=total_elecritity_cost]').val(electricity_cost);
  $('input[name=total_elecritity_revenue]').val(electricity_revenue);

  $('input[name=grid_kw]').val(Math.round(current_need*1000));
  $('.meter_battery_kwh > .text').html(Math.round(battery*10)/10 + ' kwh');


  $('input[name=days_passed]').val(parseInt(pointer/(24*60/time_resolution)));

  setTimeout(function(){ simulate_one_section(); }, 0);
}

