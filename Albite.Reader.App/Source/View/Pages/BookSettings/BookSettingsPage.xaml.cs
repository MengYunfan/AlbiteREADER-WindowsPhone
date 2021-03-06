﻿using Microsoft.Phone.Controls;
using Albite.Reader.Engine.Layout;
using System;
using System.Windows.Navigation;
using GEArgs = System.Windows.Input.GestureEventArgs;

namespace Albite.Reader.App.View.Pages.BookSettings
{
    public partial class BookSettingsPage : PhoneApplicationPage
    {
        public BookSettingsPage()
        {
            InitializeComponent();
        }

        protected override void OnNavigatedTo(NavigationEventArgs e)
        {
            // Update buttons
            updateStatusValues();

            base.OnNavigatedTo(e);
        }

        private void updateStatusValues()
        {
            // Get current layout settings
            LayoutSettings settings = App.Context.LayoutSettings;

            // Set current theme name
            ThemeControl.ContentText = settings.Theme.Name;

            // Set current font family name
            FontFamilyControl.ContentText = settings.FontSettings.Family;

            // Set current font size name
            FontSizeControl.ContentText = settings.FontSettings.FontSize.Name;

            // Set current text justification state
            TextJustificationControl.ContentText
                = settings.TextSettings.Justified ? "justified" : "left-aligned";

            // Set current line-spacing text
            LineSpacingControl.ContentText = settings.TextSettings.LineHeight.Name;

            // Set current page margins text
            PageMarginsControl.ContentText = settings.MarginSettings.Name;
        }

        private void Theme_Tap(object sender, GEArgs e)
        {
            NavigationService.Navigate(new Uri("/Albite.Reader.App;component/Source/View/Pages/BookSettings/ThemeSettingsPage.xaml", UriKind.Relative));
        }

        private void FontFamily_Tap(object sender, GEArgs e)
        {
            NavigationService.Navigate(new Uri("/Albite.Reader.App;component/Source/View/Pages/BookSettings/FontFamilySettingsPage.xaml", UriKind.Relative));
        }

        private void FontSize_Tap(object sender, GEArgs e)
        {
            NavigationService.Navigate(new Uri("/Albite.Reader.App;component/Source/View/Pages/BookSettings/FontSizeSettingsPage.xaml", UriKind.Relative));
        }

        private void TextJustification_Tap(object sender, GEArgs e)
        {
            NavigationService.Navigate(new Uri("/Albite.Reader.App;component/Source/View/Pages/BookSettings/TextJustificationSettingsPage.xaml", UriKind.Relative));
        }

        private void LineSpacing_Tap(object sender, GEArgs e)
        {
            NavigationService.Navigate(new Uri("/Albite.Reader.App;component/Source/View/Pages/BookSettings/LineSpacingSettingsPage.xaml", UriKind.Relative));
        }

        private void PageMargins_Tap(object sender, GEArgs e)
        {
            NavigationService.Navigate(new Uri("/Albite.Reader.App;component/Source/View/Pages/BookSettings/PageMarginsSettingsPage.xaml", UriKind.Relative));
        }
    }
}