defmodule CrowdCrushWeb.MarkerView do
  use CrowdCrushWeb, :view

  def render("marker.json", %{marker: m}) do
    %{
      agent: m.agent,
      time: m.time,
      x: m.x,
      y: m.y
    }
  end
end
