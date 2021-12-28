^1::
CoordMode, mouse, Screen
Loop,
{
  Send {Click, 366, 193} ; Rob Store
  Sleep, 200
  Send {Click, 366, 193}
  Sleep, 60200
}

^2::
CoordMode, mouse, Screen
Loop,
{
  Send {Click, 366, 224} ; Mug
  Sleep, 200
  Send {Click, 366, 224}
  Sleep, 4200
}

^3::
CoordMode, mouse, Screen
Loop,
{
  Send {Click, 366, 272} ; Larceny
  Sleep, 200
  Send {Click, 366, 272}
  Sleep, 90200
}

^!p::Pause    ; Pause script with Ctrl+Alt+P
^!s::Suspend  ; Suspend script with Ctrl+Alt+S
^!r::Reload   ; Reload script with Ctrl+Alt+R