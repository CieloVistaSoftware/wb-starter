# Adds the Minnesota page to the wb-starter site in the current folder.
# Run it from your my-site folder (the one with index.html in it).
$ErrorActionPreference = 'Stop'
if (-not (Test-Path 'config/site.json')) { throw 'Run this from your my-site folder (config/site.json not found).' }

# 1. The page
New-Item -ItemType Directory -Force pages, assets/minnesota | Out-Null
@'
<section id="minnesota-hero" class="page__hero">
  <h1>Minnesota</h1>
  <p>The Land of 10,000 Lakes: the North Shore of Lake Superior, the headwaters of the
    Mississippi, a million acres of canoe country and a skyline on the river.
    Click any photo to see it full size.</p>
</section>

<section id="minnesota-gallery" class="page__section">
  <h2>The beauty of the state</h2>
  <div id="minnesota-photos" x-gallery columns="3" gap="1rem">
    <figure>
      <img src="assets/minnesota/split-rock-lighthouse.jpg"
           alt="Split Rock Lighthouse on its cliff above Lake Superior" loading="lazy">
      <figcaption>Split Rock Lighthouse, North Shore</figcaption>
    </figure>
    <figure>
      <img src="assets/minnesota/north-shore.jpg"
           alt="Rocky shoreline of Lake Superior on Minnesota's North Shore" loading="lazy">
      <figcaption>Lake Superior's North Shore</figcaption>
    </figure>
    <figure>
      <img src="assets/minnesota/gooseberry-falls.jpg"
           alt="Middle Gooseberry Falls pouring over dark rock ledges" loading="lazy">
      <figcaption>Gooseberry Falls State Park</figcaption>
    </figure>
    <figure>
      <img src="assets/minnesota/boundary-waters.jpg"
           alt="Canoes on a quiet lake in the Boundary Waters Canoe Area" loading="lazy">
      <figcaption>Boundary Waters Canoe Area Wilderness</figcaption>
    </figure>
    <figure>
      <img src="assets/minnesota/itasca-headwaters.jpg"
           alt="Stepping stones across the start of the Mississippi River at Lake Itasca" loading="lazy">
      <figcaption>Mississippi Headwaters, Lake Itasca</figcaption>
    </figure>
    <figure>
      <img src="assets/minnesota/enger-park-fall.jpg"
           alt="Autumn trees in red and gold above Duluth at Enger Park" loading="lazy">
      <figcaption>Fall colors, Enger Park, Duluth</figcaption>
    </figure>
    <figure>
      <img src="assets/minnesota/aerial-lift-bridge.jpg"
           alt="Duluth's Aerial Lift Bridge lit up at night" loading="lazy">
      <figcaption>Aerial Lift Bridge, Duluth</figcaption>
    </figure>
    <figure>
      <img src="assets/minnesota/minnehaha-falls.jpg"
           alt="Minnehaha Falls dropping into its gorge in Minneapolis" loading="lazy">
      <figcaption>Minnehaha Falls, Minneapolis</figcaption>
    </figure>
    <figure>
      <img src="assets/minnesota/minneapolis-skyline.jpg"
           alt="Sunset over the Minneapolis skyline" loading="lazy">
      <figcaption>Minneapolis skyline at sunset</figcaption>
    </figure>
  </div>
</section>

<section id="minnesota-credits" class="page__section">
  <details id="minnesota-photo-credits">
    <summary>Photo credits</summary>
    <p>All photos are from <a href="https://commons.wikimedia.org/">Wikimedia Commons</a>, used under their licenses:</p>
    <ul>
      <li><a href="https://commons.wikimedia.org/wiki/File:Split_Rock_Light_Station.jpg">Split Rock Light Station</a>, MichaelDPhotos, CC BY-SA 4.0</li>
      <li><a href="https://commons.wikimedia.org/wiki/File:Lake_Superior_North_Shore_Minnesota_Tony_Webster_19283970576.jpg">Lake Superior North Shore</a>, Tony Webster, CC BY 2.0</li>
      <li><a href="https://commons.wikimedia.org/wiki/File:Middle_Gooseberry_Falls,_Gooseberry_Falls_State_Park,_Minnesota.jpg">Middle Gooseberry Falls</a>, Edward Morrissey, CC BY-SA 4.0</li>
      <li><a href="https://commons.wikimedia.org/wiki/File:BWCA_Canoe_Outing_-_001.jpg">BWCA Canoe Outing</a>, ShakataGaNai, CC BY-SA 3.0</li>
      <li><a href="https://commons.wikimedia.org/wiki/File:Mississippi_Headwaters_at_Lake_Itasca.jpg">Mississippi Headwaters at Lake Itasca</a>, Greg Gjerdingen, CC BY 2.0</li>
      <li><a href="https://commons.wikimedia.org/wiki/File:Fall_Colors_at_Enger_Park,_Duluth,_Minnesota_(25010489549).jpg">Fall Colors at Enger Park</a>, Tony Webster, CC BY-SA 2.0</li>
      <li><a href="https://commons.wikimedia.org/wiki/File:AerialLiftBridgeNight.jpg">Aerial Lift Bridge at night</a>, Jonathunder, CC BY-SA 3.0</li>
      <li><a href="https://commons.wikimedia.org/wiki/File:Redoneminnehaha.jpg">Minnehaha Falls</a>, original uploader on English Wikipedia, CC BY-SA 3.0</li>
      <li><a href="https://commons.wikimedia.org/wiki/File:Sunset_over_the_Minneapolis_skyline._(23906034652).jpg">Sunset over the Minneapolis skyline</a>, Mac H (media601), CC BY-SA 2.0</li>
    </ul>
  </details>
</section>
'@ | Set-Content -Encoding utf8 pages/minnesota.html

# 2. The menu item
$cfg = Get-Content config/site.json -Raw | ConvertFrom-Json
if (-not ($cfg.navigationMenu | Where-Object menuItemId -eq 'minnesota')) {
  $cfg.navigationMenu += [pscustomobject]@{ menuItemId = 'minnesota'; menuItemText = 'Minnesota'; menuItemEmoji = [char]::ConvertFromUtf32(0x1F332); pageToLoad = 'minnesota' }
  $cfg | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 config/site.json
}

# 3. The photo-tile styles
if (-not (Select-String -Path styles/site.css -Pattern 'Minnesota page' -Quiet)) {
@'

/* Minnesota page: photo tiles keep a 4:3 photo shape, cropped to fill. */
#minnesota-photos figure { margin: 0; }
#minnesota-photos img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 0.5rem;
  cursor: zoom-in;
}
#minnesota-photos figcaption { margin-top: 0.5rem; text-align: center; }
'@ | Add-Content -Encoding utf8 styles/site.css
}

# 4. The photos (from Wikimedia Commons, copied to the wb-starter repo; credits are on the page)
$base = 'https://raw.githubusercontent.com/CieloVistaSoftware/wb-starter/claude/minnesota-example/examples/minnesota/'
$names = 'split-rock-lighthouse','north-shore','gooseberry-falls','boundary-waters','itasca-headwaters','enger-park-fall','aerial-lift-bridge','minnehaha-falls','minneapolis-skyline'
foreach ($name in $names) {
  $out = "assets/minnesota/$name.jpg"
  if ((Test-Path $out) -and ((Get-Item $out).Length -gt 10000)) { Write-Host "  already have $name.jpg"; continue }
  Invoke-WebRequest -Uri ($base + $name + '.jpg') -OutFile $out
  Write-Host "  downloaded $name.jpg"
}
Write-Host 'Done. Reload http://localhost:3000 and open Minnesota in the menu.'
