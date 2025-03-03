(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: [ 'http://loinc.org|85354-9',
                              'http://loinc.org|8302-2', 'http://loinc.org|2085-9',
                              //'http://loinc.org|8480-6', 'http://loinc.org|8462-4', 
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4',
                              'http://loinc.org|8310-5'
                             ]
                      }
                    }
                  });
        
        var allergyIntolerance = smart.patient.api.fetchAll({
                    type: 'AllergyIntolerance',
                  });
        
        $.when(pt, obv, allergyIntolerance).fail(onError);

        $.when(pt, obv, allergyIntolerance).done(function(patient, obv, allergyIntolerance) {
          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;

          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family;   // in DSTU2 family is an array but in R4 its a string
          }

          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('85354-9'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('85354-9'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');
          var temperature = byCodes('8310-5');

          var p = defaultPatient();
          
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);

          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);
          p.temperature = getQuantityValueAndUnit(temperature[0]);


          var str = "<table>";
          console.log(allergyIntolerance);

          var loopVariable = 1;
          
          allergyIntolerance.forEach(function(item, index) {

              

              if (item?.clinicalStatus?.coding[0]?.display !== undefined) {
                  str += "<tr><td>" +(loopVariable++) + "</td>";
                  
                  str += "<td>" + item?.clinicalStatus?.coding[0]?.display + "</td>";
                  str += "<td>" + item?.code?.text + "</td>";
                  if (item?.reaction && item?.reaction[0] && item?.reaction[0]?.manifestation && item?.reaction[0]?.manifestation[0])
                      str += "<td>" + item?.reaction[0]?.manifestation[0].text + "</td></tr>";
                
              }
          });
          str += "</table>";

          p.allergies = str;
            console.log(str);
            ret.resolve(p);

          ret.resolve(p);
        });

        


      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
      temperature: {value: ''},
      allergies: {value: ''}
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
    $('#temperature').html(p.temperature);
    $('#allergies').html(p.allergies);
  };


})(window);
