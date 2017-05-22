var ErrorDisplay = React.createClass({
  render: function() {
    var errors = this.props.errors.map(function(error, i) {
      if (!Array.isArray(error)) {
        return <li className="alert alert-danger" key={i}>{error}</li>
      }else{
        return <li className={"alert alert-" + error[0]} key={i}>{error[1]}</li>
      }
    }, this);
    return (<div><ul>{errors}</ul></div>);
  }
})