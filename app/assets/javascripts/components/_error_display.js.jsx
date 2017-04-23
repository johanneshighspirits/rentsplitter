var ErrorDisplay = React.createClass({
  render: function() {
    var errors = this.props.errors.map(
      (error, i) =>
        <li className={"alert alert-" + error[0]} key={i}>{error[1]}</li>
    )
    return <div><ul>{errors}</ul></div>
  }
})