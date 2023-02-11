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
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4', 
                              'http://loinc.org|2093-3', 'http://loinc.org|3141-9',
                              'http://loinc.org|39156-5', 'http://loinc.org|5792-7' ]
                      }
                    }
                  });

        $.when(pt, obv).fail(onError);
        

        $.when(pt, obv).done(function(patient, obv) {
          var byCodes = smart.byCodes(obv, 'code');
          var address1 = patient.address[0].line;
          var address2 = patient.address[0].city;
          var address3 = patient.address[0].state;
          var address4 = patient.address[0].postalCode;
          var address = address1.concat(" ", address2, " ", address3, " ", address4);
          //let tempAdd1 = JSON.stringify(patient.address[0], null, 4); // (Optional) beautiful indented output.
          //console.log(tempAdd1);
          //let tempAdd2 = JSON.stringify(patient.address, null, 4); // (Optional) beautiful indented output.
          //console.log(tempAdd2);
          
          var gender = patient.gender;
          var identifier = patient.identifier[0].value;
          console.log(identifier);
          console.log(address);
          console.log(gender);
          //let tempStr = JSON.stringify(obv, null, 4); // (Optional) beautiful indented output.
          //console.log(tempStr)
          
          var choles = '';
          var glucose = '';

          var fname = '';
          var lname = '';
          var age = 0;

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family.join(' ');
          }
          
          

          var height = byCodes('8302-2');
          var weight = byCodes('3141-9');
          var bmi = byCodes('39156-5');
          
          var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');
          
          var choles = byCodes('2093-3');
          var glucose = byCodes('5792-7');
          
          //let cholesStr = JSON.stringify(choles, null, 4)
          //console.log("***************choles=   " + cholesStr);

          var p = defaultPatient();
     
          p.birthdate = patient.birthDate;
          
          //let addressP = JSON.stringify(address, null, 4)
          //console.log("***************address=   " + addressP);
          
          p.age = getAge(patient.birthDate);
          p.address = address;
          p.gender = gender;
          p.identifier = identifier;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);
          p.weight = getQuantityValueAndUnit(weight[0]);
          p.bmi = getQuantityValueAndUnit(bmi[0]);
          
          
          p.choles = getQuantityValueAndUnit(choles[0]);

          p.glucose = getQuantityValueAndUnit(glucose[0]);
          
          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);

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
      age: {value: ''},
      height: {value: ''},
      weight: {value: ''},
      bmi: {value: ''},
      address: {value: ''},
      identifier: {value: ''},
      
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
      choles: {value: ''},
      glucose: {value: ''}
    };
  }

  function getAge(dateString) {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
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
    $('#age').html(p.age); 
    $('#height').html(p.height);
    $('#weight').html(p.weight);
    $('#bmi').html(p.bmi);
    $('#address').html(p.address);
    $('#identifier').html(p.identifier);
    
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
    $('#choles').html(p.choles);
    $('#glucose').html(p.glucose);
  };

})(window);
