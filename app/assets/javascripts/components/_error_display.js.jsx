var ErrorDisplay = React.createClass({
  render: function() {
    var errors = this.props.errors.map((error) => <li>{error}</li>)
    return <div><ul>{errors}</ul></div>
  }
})