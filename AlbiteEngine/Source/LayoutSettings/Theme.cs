﻿namespace SvetlinAnkov.Albite.Engine.LayoutSettings
{
    // For simpicity's sake themes should be immutable
    public class Theme
    {
        private readonly string backgroundColor;
        private readonly string fontColor;
        private readonly string accentColor;

        public Theme(
            string backgroundColor, string fontColor, string accentColor)
        {
            this.backgroundColor = backgroundColor;
            this.fontColor = fontColor;
            this.accentColor = accentColor;
        }

        public string BackgroundColor { get { return backgroundColor; } }
        public string FontColor { get { return fontColor; } }
        public string AccentColor { get { return accentColor; } }
    }
}