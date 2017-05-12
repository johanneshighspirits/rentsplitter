var Form = React.createClass({
  getInitialState: function(){
    var controllers = {};
    var controlValues = {};
    this.props.fields.forEach(function(item){
      // Add value to controlValues
      switch (item.fieldType) {
        case "select":
        case "text":
        case "email":
        case "password":
        case "number":
        case "date":
        case "hidden":
        case "checkbox":
          controlValues[item.attribute] = item.defaultValue;
        break;
        case "radio":
          controlValues[item.attribute] = "";
        break;
        default:
          console.warn("Ignored: " + item.attribute + ", with " + item.defaultValue);
      }

      if (item.isControlling !== undefined) {
        if (controllers[item.attribute] === undefined) {
          controllers[item.attribute] = [{
            id: item.attribute,
            controlType: item.controlType,
            targetId: item.isControlling,
            targetAction: item.targetAction,
            fieldValue: item.defaultValue
          }];
        }else{
          controllers[item.attribute].push({
            id: item.attribute,
            controlType: item.controlType,
            targetId: item.isControlling,
            targetAction: item.targetAction,
            fieldValue: item.defaultValue
          });          
        }
      }
    });
    return ({
      controllers: controllers,
      controlValues: controlValues,
      fields: this.props.fields
    });
  },
  pluralize: function(str) {
    return str.replace("_id", "s");
  },
  handleSelect: function(e) {
    if (this.state.controlValues[e.target.name] !== undefined) {
      var controlValues = this.state.controlValues;
      switch (e.target.type) {
        case "checkbox":
          controlValues[e.target.name] = !controlValues[e.target.name];
        break;
        default:
          controlValues[e.target.name] = e.target.value;
        break;
      }
      this.setState({
        controlValues: controlValues
      });      
    }

    if (this.state.controllers[e.target.name] !== undefined) {

      var controller = this.state.controllers[e.target.name];
      switch (controller[0].controlType) {
        case "select":
        // This Select is controlling another one, meaning that when
        // this value changes, the other value should change too.
        var url = "/" + this.pluralize(e.target.name) + "/" + e.target.value + "/" + this.pluralize(controller[0].targetId) + ".json";
        $.get(url, function(results){
          var fields = this.state.fields.map(function(item, i){
            if (item.attribute == controller[0].targetId) {
              item.options = results;
            }
            return item;
          });
          this.setState({
            fields: fields
          });
        }.bind(this), 'json');
        break;
      }
    }
  },
  render: function() {
    var fields = this.state.fields.map(function(item, i){
      if (item.isVisibleIfChecked !== undefined) {
        // This item is only rendered if `isVisibleIfChecked` is selected/checked
        var ids = item.isVisibleIfChecked.split("#");
        if (this.state.controlValues[ids[0]] != ids[1]) {
          return null;
        }
      }
      switch(item.fieldType) {
        case "select":
          return (<FormSelect
            key={i}
            attribute={item.attribute}
            attributeName={item.attributeName}
            options={item.options}
            fieldValue={this.state.controllers[item.attribute] !== undefined ? this.state.controllers[item.attribute].fieldValue : this.state.controlValues[item.attribute]}
            handleSelect={this.handleSelect}
          />)
        break;
        case "checkbox":
          return (<FormCheckbox 
            key={i}
            attribute={item.attribute}
            attributeName={item.attributeName}
            checked={this.state.controlValues[item.attribute]}
            handleSelect={this.handleSelect}          
          />)
        case "radio":
          return (<FormRadio 
            key={i}
            attribute={item.attribute}
            attributeName={item.attributeName}
            options={item.options}
            fieldValue={item.defaultValue}
            checked={this.state.controlValues[item.attribute] == item.defaultValue}
            handleSelect={this.handleSelect}
          />)
        break;
        case "p":
          return <p key={i}>{item.text}</p>
        break;
        case "submit":
          return <FormSubmit key={i} attributeName={item.attributeName} />
        break;
        default:
          return (<FormField
            key={i}
            fieldType={item.fieldType}
            attribute={item.attribute}
            attributeName={item.attributeName}
            handleSelect={this.handleSelect}            
            defaultValue={this.state.controlValues[item.attribute]}
          />)
        break;
      }
    }, this)
    var flash = this.props.flash !== undefined ? this.props.flash.map(function(error, i) {
      return <span key={i} className={"alert alert-" + error[0]}>{error[1]}</span>
    }) : null;
    return (
      <form acceptCharset="UTF-8" action={this.props.action} method="post">
        <input type="hidden" name="authenticity_token" defaultValue={this.props.authenticity_token} />
        {flash}
        {fields}
      </form>
    )
  }

});

var FormField = React.createClass({
  render: function() {
    var idName = this.props.attribute.replace("[", "_").replace("]", "");
    return (
      <div>
        <label htmlFor={idName}>{this.props.attributeName}</label>
        <input type={this.props.fieldType} onChange={this.props.handleSelect} name={this.props.attribute} id={idName} defaultValue={this.props.defaultValue} />
      </div>
    )
  }
});

var FormSelect = React.createClass({
  render: function() {
    var options = this.props.options.map(function(option, i){
      return <option key={i} value={option[0]}>{option[1]}</option>
    });
    return (
      options.length > 0 ?
      <div>
        <label htmlFor={this.props.attribute}>{this.props.attributeName}</label>
        <select
          value={this.props.fieldValue}
          name={this.props.attribute}
          id={this.props.attribute}
          onChange={this.props.handleSelect}>
            {options}
        </select>
      </div>
      : null
    )
  }
});

var FormRadio = React.createClass({
  render: function() {
    return (
      <div>
        <label htmlFor={this.props.attribute}>{this.props.attributeName}</label>
        <input
          type="radio"
          value={this.props.fieldValue}
          name={this.props.attribute}
          id={this.props.attribute + "_" + this.props.fieldValue}
          checked={this.props.checked}
          onChange={this.props.handleSelect}
        />
      </div>
    )
  }
});

var FormCheckbox = React.createClass({
  render: function() {
    return (
      <div>
        <label htmlFor={this.props.attribute}>{this.props.attributeName}</label>
        <input
          type="checkbox"
          value={this.props.fieldValue}
          name={this.props.attribute}
          id={this.props.attribute + "_" + this.props.fieldValue}
          checked={this.props.checked}
          onChange={this.props.handleSelect}
        />
      </div>
    )
  }
});
var FormSubmit = React.createClass({
  render: function() {
    return (
      <div>
        <input
          type="submit"
          name="commit"
          value={this.props.attributeName}
        />
      </div>
    )
  }
})