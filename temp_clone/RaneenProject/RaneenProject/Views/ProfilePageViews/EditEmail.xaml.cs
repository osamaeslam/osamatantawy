using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Xamarin.Forms;
using Xamarin.Forms.Xaml;

namespace RaneenProject.Views.ProfilePageViews
{
    [XamlCompilation(XamlCompilationOptions.Compile)]
    public partial class EditEmail : ContentPage
    {
        public EditEmail()
        {
            InitializeComponent();
        }

        private void backButton(object sender, EventArgs e)
        {
            Navigation.PopAsync();
        }
    }
}