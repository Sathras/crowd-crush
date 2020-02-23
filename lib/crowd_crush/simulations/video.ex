defmodule CrowdCrush.Simulation.Video do
  use CrowdCrush, :schema

  schema "videos" do
    field :url, :string, virtual: true
    field :aspectratio, :float
    field :duration, :integer
    field :title, :string
    field :youtubeID, :string
    field :m0_x, :float, default: 0.8
    field :m0_y, :float, default: 0.8
    field :mX_x, :float, default: 0.9
    field :mX_y, :float, default: 0.8
    field :mY_x, :float, default: 0.8
    field :mY_y, :float, default: 0.9
    field :mR_x, :float, default: 0.9
    field :mR_y, :float, default: 0.9
    field :dist_x, :float
    field :dist_y, :float
    has_many :markers, CrowdCrush.Simulation.Marker
    has_many :overlays, CrowdCrush.Simulation.Overlay
    timestamps()
  end

  @doc """
  Builds a changeset based on the `struct` and `params`.
  """
  def changeset(struct, params) do
    struct
    |> cast(params, ~w(url aspectratio duration title youtubeID m0_x m0_y mX_x mX_y mY_x mY_y mR_x mR_y dist_x dist_y)a)
    |> validate_required([:aspectratio, :duration, :title, :youtubeID])
    |> validate_url(:url)
    |> validate_youtube_url(:url)
    |> validate_format(:title, ~r/^[^<>]*$/)
    |> validate_length(:title, min: 5, max: 100)
    |> validate_number(:duration, greater_than: 0)
    |> validate_number(:m0_x, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
    |> validate_number(:m0_y, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
    |> validate_number(:mX_x, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
    |> validate_number(:mX_y, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
    |> validate_number(:mY_x, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
    |> validate_number(:mY_y, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
    |> validate_number(:mR_x, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
    |> validate_number(:mR_y, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
    |> validate_number(:dist_x, greater_than: 0)
    |> validate_number(:dist_y, greater_than: 0)
    |> unique_constraint(:youtubeID)
  end

  defp validate_url(changeset, field, opts \\ []) do
    validate_change changeset, field, fn _, value ->
      case URI.parse(value) do
        %URI{scheme: nil} -> "is missing a scheme (e.g. https)"
        %URI{host: nil} -> "is missing a host"
        %URI{host: host} ->
          case :inet.gethostbyname(Kernel.to_charlist host) do
            {:ok, _} -> nil
            {:error, _} -> "invalid host"
          end
      end
      |> case do
        error when is_binary(error) -> [{field, Keyword.get(opts, :message, error)}]
        _ -> []
      end
    end
  end

  defp validate_youtube_url(changeset, field, opts \\ []) do
    error = "Not a valid Youtube URL. Accepted format: https://www.youtube.com/watch?v=youtubeID"

    validate_change changeset, field, fn _, url ->

      case String.split(url, "?") do
        ["https://www.youtube.com/watch", params] ->
          case URI.decode_query(params) do
            %{"v" => youtubeID} -> []
            _ -> error
          end
        _ -> error
      end
      |> case do
        error when is_binary(error) -> [{field, Keyword.get(opts, :message, error)}]
        _ -> []
      end
    end
  end
end
