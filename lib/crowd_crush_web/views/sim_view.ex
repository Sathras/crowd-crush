defmodule CrowdCrushWeb.SimView do
  use CrowdCrushWeb, :view

  def count_markers(video, selected) do
    agent =
      video.markers
      |> Enum.group_by(fn {id, _, _, _} -> id end, fn {_, t, x, y} -> {t, x, y} end)
      |> Map.get(selected)

    case agent do
      nil -> 0
      agent -> Enum.count(agent)
    end
  end

  def encode_video(video) do
    video
    |> Map.take([
        :radius, :max_speed, :velocity, :max_neighbors, :neighbor_dist, :time_horizon, :time_horizon_obst, :aspectratio, :youtubeID
      ])
    |> Jason.encode!()
  end

  def btn(action, disabled \\ false) do
    content_tag :button, icon(action),
      class: "btn btn-sm btn-outline-light",
      disabled: disabled,
      phx_click: "control",
      phx_value_action: action
  end

  def btn_mode(mode, active_mode, icon) do
    content_tag :button, icon(icon),
      class: "btn btn-outline-light btn-sm#{if mode == active_mode, do: " active"}",
      title: "Mode: #{String.capitalize(mode)}",
      phx_click: "set",
      phx_value_mode: mode
  end

  def btn_toggle(setting, active \\ false, icon \\ nil) do
    content_tag :button, icon(icon || setting),
      class: "btn btn-outline-light btn-sm#{if active, do: " active"}",
      title: "Toggle #{String.capitalize(setting)}",
      phx_click: "toggle",
      phx_value_setting: setting
  end

  def mode(mode, active?) do
    content_tag :button, icon(mode),
      class: "btn btn-outline-light btn-sm#{if active?, do: " active"}",
      phx_click: "set",
      phx_value_mode: mode,
      area_pressed: mode
  end

  def toggle(property, active?) do
    content_tag :button, icon(property),
      class: "btn btn-outline-light btn-sm#{if active?, do: " active"}",
      phx_click: "toggle-#{property}",
      area_pressed: active?
  end
end
