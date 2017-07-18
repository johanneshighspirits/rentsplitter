class CalendarEventsController < ApplicationController
  
  include SessionsHelper
  include ProjectsHelper

  before_action :logged_in_member
  before_action :set_calendar_event, only: [:show, :edit, :update, :destroy]

  # GET /calendar_events
  # GET /calendar_events.json
  def index
    @project = Project.find(current_project_id)
    @calendar_events = @project.calendar_events
    @members = @project.members.sort { |m| m.id == current_member.id ? -1 : 1}
  end

  # GET /calendar_events/1
  # GET /calendar_events/1.json
  def show
  end

  # GET /calendar_events/new
  def new
    @calendar_event = CalendarEvent.new
  end

  # GET /calendar_events/1/edit
  def edit
  end

  # POST /calendar_events
  def create
    project = current_member.projects.where(id: current_project_id).first
    p params
    dayRange = params[:calendar_event][:from]..params[:calendar_event][:to]
    p dayRange
    conflicts = CalendarEvent.where("('from' BETWEEN ? AND ?) AND ('to' BETWEEN ? AND ?)", params[:calendar_event][:from], params[:calendar_event][:to], params[:calendar_event][:from], params[:calendar_event][:to]).exists?
    puts "conflicts:"
    p conflicts
    
    if conflicts
      render json: { error: "CONFLICT: Booking conflicts with another booking" }
    else
      @calendar_event = project.calendar_events.build(calendar_event_params)
      if project.save 
        render json: {
          success: true,
          message: "Booking successfully saved.",
          bookingId: @calendar_event.id
        }
      else
        p project.errors
        p @calendar_event.errors
        render json: {
          error: {
            code: "#{@calendar_event.errors.messages}",
            message: "Booking could not be saved. Please try again later."
          }
        }
      end
    end
  end

  # PATCH/PUT /calendar_events/1
  # PATCH/PUT /calendar_events/1.json
  def update
    respond_to do |format|
      if @calendar_event.update(calendar_event_params)
        format.html { redirect_to @calendar_event, notice: 'Calendar event was successfully updated.' }
        format.json { render :show, status: :ok, location: @calendar_event }
      else
        format.html { render :edit }
        format.json { render json: @calendar_event.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /calendar_events/1
  # DELETE /calendar_events/1.json
  def destroy
    @calendar_event.destroy
    render json: {
      success: true,
      message: "Booking successfully removed."
    }
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_calendar_event
      @calendar_event = CalendarEvent.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def calendar_event_params
      params.require(:calendar_event).permit(:from, :to, :project_id, :member_id)
    end
end
