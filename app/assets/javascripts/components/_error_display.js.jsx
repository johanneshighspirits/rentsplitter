var ErrorDisplay = React.createClass({
  render: function() {
    console.log(this.props.errors);
    if (this.props.errors.length == 0) { return <p>NO ERRORS</p> }
    var errors = this.props.errors.map(function(error, i) {
      if (Array.isArray(error)) {
        return <li className="alert alert-danger" key={i}>{error}</li>
      }else{
        return <li className={"alert alert-" + error[0]} key={i}>{error[1]}</li>
      }
    }, this);
    return (<div><ul>{errors}</ul></div>);
  }
})