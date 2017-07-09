class CalendarEventsController < ApplicationController
  
  include SessionsHelper
  include ProjectsHelper

  before_action :logged_in_member
  before_action :set_calendar_event, only: [:show, :edit, :update, :destroy]

  # GET /calendar_events
  # GET /calendar_events.json
  def index
    @calendar_events = CalendarEvent.all
#    @calendar_event = current_member.calendar_events.build
    @project_id = current_project_id
    @members = Project.find(current_project_id).members.sort { |m| m.id == current_member.id ? -1 : 1}
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
  # POST /calendar_events.json
  def create
    project = current_member.projects.where(id: current_project_id).first
    @calendar_event = project.calendar_events.build(calendar_event_params)
    if project.save 
      render json: {
        success: true,
        message: "Booking successfully saved."
      }
    else
      p project.errors
      p @calendar_event.errors
      render json: { error: "#{@calendar_event.errors}" }
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
    respond_to do |format|
      format.html { redirect_to calendar_events_url, notice: 'Calendar event was successfully destroyed.' }
      format.json { head :no_content }
    end
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
