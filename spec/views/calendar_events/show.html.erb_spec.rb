require 'rails_helper'

RSpec.describe "calendar_events/show", type: :view do
  before(:each) do
    @calendar_event = assign(:calendar_event, CalendarEvent.create!(
      :booked_by => ""
    ))
  end

  it "renders attributes in <p>" do
    render
    expect(rendered).to match(//)
  end
end
